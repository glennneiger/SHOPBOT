from setuptools import find_packages, setup

setup(
    name='chatbot-retail',
    version='1.0.0',
    description = 'Basic chatbot built for retail',
    long_description = 'Will be displayed in the website',
    url = '',
    author = '',
    author_email = '',
    license= 'PTG',
    classifiers = [
        'Development Status :: Alpha',
        'Intended Audience :: ML Enthusiasts',
        'Programming Language :: python ::3.6'
    ],
    keywords = 'chatbot retail shop ',
    packages=find_packages(exclude = ['docs', 'tests']),
    include_package_data=True,
    package_data = {
        'sample':['package_data.dat']
    },
    zip_safe=False,
    data_files =None,
    install_requires=[
        'Flask==1.0.2','requests == 2.18.4','dialogflow==0.4.0','pusher==2.0.1'
    ]
)

